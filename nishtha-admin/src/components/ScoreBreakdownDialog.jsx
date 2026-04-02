// src/components/ScoreBreakdownDialog.jsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const ScoreBreakdownDialog = ({ scoreBreakdown, onClose }) => {
  return (
    <Dialog open={!!scoreBreakdown} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Credit Decision Insights</DialogTitle>
          <DialogDescription>Explainable AI breakdown for {scoreBreakdown?.id}</DialogDescription>
        </DialogHeader>

        {scoreBreakdown && (
          <div className="space-y-3">
            <p>
              <strong>Credit Score:</strong>{" "}
              <span className={scoreBreakdown.creditScore > 700 ? "text-green-600" : "text-red-600"}>
                {scoreBreakdown.creditScore}
              </span>
            </p>

            <p>
              <strong>Risk Score:</strong>{" "}
              <span
                className={
                  scoreBreakdown.riskScore < 0.2
                    ? "text-green-600"
                    : scoreBreakdown.riskScore < 0.5
                    ? "text-yellow-600"
                    : "text-red-600"
                }
              >
                {(scoreBreakdown.riskScore * 100).toFixed(1)}%
              </span>
            </p>

            <p>
              <strong>Fraud Probability:</strong>{" "}
              <span
                className={
                  scoreBreakdown.fraudProbability < 0.05
                    ? "text-green-600"
                    : scoreBreakdown.fraudProbability < 0.2
                    ? "text-yellow-600"
                    : "text-red-600"
                }
              >
                {(scoreBreakdown.fraudProbability * 100).toFixed(1)}%
              </span>
            </p>

            <p>
              <strong>Need Score:</strong>{" "}
              <span
                className={
                  scoreBreakdown.needScore > 0.7
                    ? "text-blue-600"
                    : scoreBreakdown.needScore > 0.4
                    ? "text-yellow-600"
                    : "text-red-600"
                }
              >
                {(scoreBreakdown.needScore * 100).toFixed(1)}%
              </span>
            </p>

            <p><strong>Estimated Income:</strong> ₹{scoreBreakdown.estimatedIncome.toLocaleString()}</p>
            <p><strong>Estimated Safe Loan:</strong> ₹{scoreBreakdown.estimatedSafeLoan.toLocaleString()}</p>

            <h2
              className={
                scoreBreakdown.finalEligibilityScore > 0.8
                  ? "font-semibold text-lg text-green-600"
                  : scoreBreakdown.finalEligibilityScore > 0.5
                  ? "font-semibold text-lg text-yellow-600"
                  : "font-semibold text-lg text-red-600"
              }
            >
              Final Score: {(scoreBreakdown.finalEligibilityScore * 100).toFixed(2)}%
            </h2>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ScoreBreakdownDialog;
