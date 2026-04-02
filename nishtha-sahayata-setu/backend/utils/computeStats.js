function computeStats(bills) {
    console.log("=== Starting computeStats ===");
    console.log("Input bills:", bills);
  
    if (!bills || bills.length === 0) {
      console.log("No bills provided, returning empty object.");
      return {};
    }
  
    // Parse amounts and delays safely
    const amounts = bills.map(b => parseFloat(String(b.bill_amount).replace(/[^0-9.-]+/g, "")) || 0);
    const delayDays = bills.map(b => parseInt(b.delay_days || 0, 10));
  
    console.log("Parsed amounts:", amounts);
    console.log("Parsed delay days:", delayDays);
  
    // Calculations
    const elec_total_bills = bills.length;
    const elec_total_bill_amt_3m = amounts.reduce((a, b) => a + b, 0);
    const elec_avg_bill_amt_3m = Math.round(elec_total_bill_amt_3m / elec_total_bills);
  
    const elec_on_time_bills_3m = bills.filter(b => (parseInt(b.delay_days || 0, 10)) <= 0).length;
    const elec_late_bills_3m = elec_total_bills - elec_on_time_bills_3m;
  
    const elec_total_delay_days_3m = delayDays.reduce((a, b) => a + b, 0);
    const elec_max_delay_days_3m = Math.max(...delayDays);
  
    // Outstanding amount from last bill
    const outstanding = parseFloat(String(bills[bills.length - 1].outstanding_amount).replace(/[^0-9.-]+/g, "")) || 0;
  
    // Sudden drop index
    let sudden_drop_index = 0;
    if (amounts.length >= 3 && amounts[1] !== 0) {
      sudden_drop_index = (amounts[2] - amounts[1]) / amounts[1];
    }
  
    const stats = {
      elec_total_bills,
      elec_total_bill_amt_3m,
      elec_avg_bill_amt_3m,
      elec_on_time_bills_3m,
      elec_late_bills_3m,
      elec_total_delay_days_3m,
      elec_max_delay_days_3m,
      elec_outstanding_amount_current: outstanding,
      sudden_drop_index,
    };
  
    console.log("Computed stats:", stats);
    console.log("=== Ending computeStats ===");
  
    return stats;
  }
  
  module.exports = { computeStats };
  