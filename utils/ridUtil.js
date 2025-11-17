/** RID Generator - Sequential RID generation with prefix */

const db = require('../models');

// RID counter storage (in production, use database sequence)
let ridCounters = {
  br: 1000,
  usr: 1000,
  tbl: 1000,
  cat: 1000,
  itm: 1000,
  ord: 1000,
  notif: 1000
};

/**
 * Generate sequential RID with given prefix
 * @param {string} prefix - RID prefix (br, usr, tbl, cat, itm, ord, notif)
 * @returns {string} Sequential RID
 */
exports.generateRid = (prefix) => {
  if (!ridCounters.hasOwnProperty(prefix)) {
    throw new Error(`Invalid RID prefix: ${prefix}`);
  }
  const newRid = `${prefix}-${ridCounters[prefix]}`;
  ridCounters[prefix]++;
  return newRid;
};

/**
 * Initialize RID counters from database
 * Sets counter to max existing + 1 for each prefix
 */
exports.initializeCounters = async () => {
  try {
    console.log('Initializing RID counters from database...');
    const { sequelize } = db;
    
    // Get max RID for each table
    const tables = ['branches', 'users', 'tables', 'menu_categories', 'menu_items', 'orders', 'notifications'];
    const prefixes = ['br', 'usr', 'tbl', 'cat', 'itm', 'ord', 'notif'];
    
    ridCounters = {};
    
    for (let i = 0; i < tables.length; i++) {
      try {
        const result = await sequelize.query(
          `SELECT COALESCE(MAX(CAST(SUBSTRING(rid FROM POSITION('-' IN rid) + 1) AS INTEGER)), 999) as max_num FROM ${tables[i]}`
        );
        const maxNum = result[0][0]?.max_num || 999;
        ridCounters[prefixes[i]] = maxNum + 1;
      } catch (err) {
        // If query fails, start from 1000
        ridCounters[prefixes[i]] = 1000;
      }
    }
    
    console.log('✅ RID counters initialized:', ridCounters);
  } catch (error) {
    console.error('Error initializing RID counters:', error.message);
    // Fallback: reset to 1000
    ridCounters = {
      br: 1000,
      usr: 1000,
      tbl: 1000,
      cat: 1000,
      itm: 1000,
      ord: 1000,
      notif: 1000
    };
  }
};
