const { supabaseAdmin } = require('../lib/supabaseAdmin');

/**
 * Kill Switch Middleware
 * Blocks sensitive operations if the bank is in Safe Mode.
 */
module.exports = async (req, res, next) => {
  try {
    const { data: config } = await supabaseAdmin
      .from('system_config')
      .select('value')
      .eq('key', 'system_lock')
      .single();

    if (config && config.value.active) {
      return res.status(503).json({
        error: true,
        message: 'NexusBank is currently in Safe Mode due to a security event. Financial operations are temporarily suspended.'
      });
    }

    next();
  } catch (err) {
    // If we can't check the switch, fail safe (LOCKED)
    res.status(503).json({ error: 'Security Engine Offline' });
  }
};
