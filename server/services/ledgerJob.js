const { supabaseAdmin } = require('../lib/supabaseAdmin');
const logger = require('../utils/logger');
const alertService = require('./alertService');

/**
 * Shadow Ledger Job
 * Performs periodic global consistency checks to detect balance or chain tampering.
 */
class LedgerJob {
  constructor() {
    this.checkInterval = 5 * 60 * 1000; // 5 Minutes
  }

  async start() {
    logger.info('Forensic Surveillance Active [HMAC Chains + Shadow Ledger]');
    setInterval(() => this.runVerification(), this.checkInterval);
    this.runVerification();
  }

  async runVerification() {
    try {
      // 1. GENESIS VERIFICATION (Root of Trust)
      await this.verifyGenesis();

      // 2. CHOSEN SAMPLE CHAIN VERIFICATION
      await this.verifyChainIntegrity();

      // 3. GLOBAL BALANCE CONSISTENCY
      await this.verifyTotalBalance();

      logger.info('System Integrity: HEALTHY');
    } catch (err) {
      await alertService.handleSecurityEvent({
        type: 'SYSTEM_INTEGRITY_FAIL',
        severity: 'CRITICAL',
        metadata: { error: err.message }
      });
    }
  }

  async verifyGenesis() {
    const { data: config } = await supabaseAdmin.from('system_config').select('value').eq('key', 'genesis_hash').single();
    const { data: firstTx } = await supabaseAdmin.from('transactions').select('previous_hash').order('created_at', { ascending: true }).limit(1).single();

    if (firstTx && firstTx.previous_hash !== config.value.hash) {
      throw new Error('Genesis Block Tampered');
    }
  }

  async verifyChainIntegrity() {
    // Check the latest 5 transactions for chaining breaks
    const { data: txs } = await supabaseAdmin
      .from('transactions')
      .select('integrity_hash, previous_hash, balance_hash, chain_hash')
      .order('created_at', { ascending: false })
      .limit(5);

    for (let i = 0; i < txs.length - 1; i++) {
        const current = txs[i];
        const nextInChain = txs[i+1];
        if (current.previous_hash !== nextInChain.chain_hash) {
            throw new Error(`Chain Broken at txn gap`);
        }
    }
  }

  async verifyTotalBalance() {
    const { data: config } = await supabaseAdmin.from('system_config').select('value').eq('key', 'expected_total_balance').single();
    const { data: accounts } = await supabaseAdmin.from('accounts').select('balance');
    
    const actualTotal = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
    const expectedTotal = parseFloat(config.value.amount);

    if (Math.abs(actualTotal - expectedTotal) > 0.01) {
      throw new Error(`Ledger Mismatch: ${actualTotal} vs ${expectedTotal}`);
    }
  }

  /**
   * Called by TransactionService after a successful movement to update the shadow total
   */
  async updateExpectedTotal(amountChange) {
    const { data: config } = await supabaseAdmin.from('system_config').select('value').eq('key', 'expected_total_balance').single();
    const newTotal = parseFloat(config.value.amount) + amountChange;
    
    await supabaseAdmin.from('system_config').update({
      value: { amount: newTotal, last_tx: new Date().toISOString() }
    }).eq('key', 'expected_total_balance');
  }
}

module.exports = new LedgerJob();
