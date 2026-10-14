import { affiliateService } from "./affiliateService";

export async function runAllAffiliateTests(): Promise<{
  passed: boolean;
  results: Array<{ test: string; passed: boolean; message: string }>;
}> {
  const results: Array<{ test: string; passed: boolean; message: string }> = [];

  const logTest = (test: string, passed: boolean, message: string) => {
    results.push({ test, passed, message });
    if (!passed) {
      console.error(`[FAIL] ${test}: ${message}`);
    }
  };

  try {
    affiliateService.ensureTables();

    // Test 1: Program rules verification ($10->$1, $50->$5, $100->$10)
    const testCases = [
      { plan: "basic", paid: 10, expectedComm: 1.0 },
      { plan: "agent", paid: 50, expectedComm: 5.0 },
      { plan: "automated_pipeline", paid: 100, expectedComm: 10.0 },
    ];

    for (const tc of testCases) {
      const calcComm = Math.round(tc.paid * 0.1 * 100) / 100;
      const ok = calcComm === tc.expectedComm;
      logTest(
        `Commission Rule (${tc.plan}: $${tc.paid}/mo -> 10% = $${tc.expectedComm})`,
        ok,
        ok ? `Correct: $${calcComm}` : `Expected $${tc.expectedComm}, got $${calcComm}`
      );
    }

    // Test 2: Self-referral prevention
    const selfReferralRes = affiliateService.recordSignup({
      affiliateCode: "FLOWCREATOR",
      referredUserId: "user_default",
      referredUserEmail: "digitalkingbeat@gmail.com",
      referredUserName: "Self Referrer",
    });
    const selfReferralBlocked = !selfReferralRes.success && selfReferralRes.error?.includes("Self-referral");
    logTest(
      "Self-Referral Prevention",
      Boolean(selfReferralBlocked),
      selfReferralBlocked ? "Correctly blocked self-referral" : "FAILED to block self-referral"
    );

    // Test 3: Record valid new referral with review period
    const testEmail = `test_creator_${Date.now()}@audioflow.com`;
    const newRefRes = affiliateService.recordSignup({
      affiliateCode: "FLOWCREATOR",
      referredUserId: `usr_test_${Date.now()}`,
      referredUserEmail: testEmail,
      referredUserName: "Test Creator",
      autoVerify: false, // In review period
    });
    const signupOk = Boolean(newRefRes.success && newRefRes.referral?.verificationStatus === "pending_review");
    logTest(
      "Referral Signup with 14-day Review Period",
      signupOk,
      signupOk ? "Signup recorded with pending_review status" : "Failed to record pending signup"
    );

    // Test 4: Duplicate signup prevention
    const dupSignupRes = affiliateService.recordSignup({
      affiliateCode: "FLOWCREATOR",
      referredUserId: `usr_dup_${Date.now()}`,
      referredUserEmail: testEmail, // same email
      referredUserName: "Duplicate Creator",
    });
    const dupBlocked = !dupSignupRes.success && dupSignupRes.error?.includes("Duplicate");
    logTest(
      "Duplicate Signup Prevention",
      Boolean(dupBlocked),
      dupBlocked ? "Duplicate email successfully rejected" : "Failed to prevent duplicate signup"
    );

    // Test 5: Verify signup and award $5 bonus
    if (newRefRes.referral) {
      const verifyRes = affiliateService.verifySignup(newRefRes.referral.id);
      const verifyOk = Boolean(verifyRes.success && verifyRes.referral?.signupBonusAmount === 5.0);
      logTest(
        "Verification & $5 One-Time Signup Bonus Credit",
        verifyOk,
        verifyOk ? "$5 bonus credited upon account verification" : "Verification bonus failed"
      );

      // Duplicate bonus prevention: attempt to verify again
      const secondVerify = affiliateService.verifySignup(newRefRes.referral.id);
      const dupBonusBlocked = !secondVerify.success;
      logTest(
        "Duplicate Signup Bonus Prevention",
        dupBonusBlocked,
        dupBonusBlocked ? "Prevented second $5 bonus credit on already verified account" : "Failed duplicate bonus check"
      );

      // Test 6: Payment event (10% recurring)
      const payEventId = `evt_test_pay_${Date.now()}`;
      const payRes = affiliateService.recordPaymentEvent({
        paymentEventId: payEventId,
        referredUserEmailOrId: testEmail,
        amountActuallyPaid: 50.0,
        planId: "agent",
        eventType: "payment_success",
      });
      const payOk = Boolean(payRes.success && payRes.commission?.amount === 5.0);
      logTest(
        "Subscription Payment (10% on $50.00 = $5.00)",
        payOk,
        payOk ? "Successfully credited $5.00 recurring commission" : "Payment commission failed"
      );

      // Test 7: Duplicate Payment Event Prevention (Idempotency)
      const dupPayRes = affiliateService.recordPaymentEvent({
        paymentEventId: payEventId, // same event ID
        referredUserEmailOrId: testEmail,
        amountActuallyPaid: 50.0,
        planId: "agent",
        eventType: "payment_success",
      });
      const dupPayBlocked = !dupPayRes.success && dupPayRes.error?.includes("Duplicate payment event");
      logTest(
        "Duplicate Payment Event Idempotency Check",
        Boolean(dupPayBlocked),
        dupPayBlocked ? "Duplicate payment event rejected" : "Failed to prevent duplicate payment event"
      );

      // Test 8: Discount & Refund adjustments
      const discountPayRes = affiliateService.recordPaymentEvent({
        paymentEventId: `evt_disc_${Date.now()}`,
        referredUserEmailOrId: testEmail,
        amountActuallyPaid: 40.0, // 20% discount on $50
        planId: "agent",
        eventType: "discount_applied",
      });
      const discountOk = Boolean(discountPayRes.success && discountPayRes.commission?.amount === 4.0);
      logTest(
        "Discount Adjustment (10% on $40.00 = $4.00)",
        discountOk,
        discountOk ? "Correctly calculated 10% on actual discounted paid amount ($4.00)" : "Discount calculation failed"
      );

      const refundRes = affiliateService.recordPaymentEvent({
        paymentEventId: `evt_ref_${Date.now()}`,
        referredUserEmailOrId: testEmail,
        amountActuallyPaid: 50.0,
        planId: "agent",
        eventType: "refund",
      });
      const refundOk = Boolean(refundRes.success && refundRes.commission?.amount === -5.0);
      logTest(
        "Refund Deduction Adjustment (-$5.00 on $50.00 refund)",
        refundOk,
        refundOk ? "Correctly deducted $5.00 refund adjustment" : "Refund adjustment failed"
      );
    }

    // Test 9: Stats segregation (signup bonuses vs recurring earnings)
    const stats = affiliateService.getStats();
    const statsOk = Boolean(
      stats &&
      typeof stats.individualSignupBonusesEarned === "number" &&
      typeof stats.recurringCommissionsEarned === "number" &&
      stats.totalEarningsAllTime === stats.individualSignupBonusesEarned + stats.recurringCommissionsEarned
    );
    logTest(
      "Affiliate Stats Segregation (Signup Bonus vs Recurring)",
      statsOk,
      statsOk
        ? `Separation verified: $${stats.individualSignupBonusesEarned} bonus + $${stats.recurringCommissionsEarned} recurring = $${stats.totalEarningsAllTime}`
        : "Stats segregation failed"
    );

    const allPassed = results.every((r) => r.passed);
    return { passed: allPassed, results };
  } catch (err: any) {
    results.push({ test: "Exception during affiliate tests", passed: false, message: err.message });
    return { passed: false, results };
  }
}
