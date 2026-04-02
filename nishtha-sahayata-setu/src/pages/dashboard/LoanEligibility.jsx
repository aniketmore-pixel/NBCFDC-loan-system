import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  IndianRupee,
  Calculator,
  CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";

const LoanEligibility = () => {
  const [monthlyIncome, setMonthlyIncome] = useState("25010");
  const [monthlyExpenses, setMonthlyExpenses] = useState("15010");
  
  const income = parseFloat(monthlyIncome) || 0;
  const expenses = parseFloat(monthlyExpenses) || 0;
  const disposableIncome = income - expenses;
  const eligibleAmount = Math.max(0, disposableIncome * 40); // 40x monthly disposable income
  const maxLoanAmount = 501000; // 5 Lakhs max
  const finalEligible = Math.min(eligibleAmount, maxLoanAmount);

  return (
    <div className="container mx-auto px-4 py-8 pt-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Loan Eligibility Calculator</h1>
        <p className="text-muted-foreground">Calculate your eligible loan amount based on income and expenses</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Calculator Card */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Income & Expense Details
            </CardTitle>
            <CardDescription>
              Update your financial details to see your eligible loan amount
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="income">Monthly Income (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="income"
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  className="pl-9"
                  placeholder="Enter monthly income"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expenses">Monthly Expenses (₹)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="expenses"
                  type="number"
                  value={monthlyExpenses}
                  onChange={(e) => setMonthlyExpenses(e.target.value)}
                  className="pl-9"
                  placeholder="Enter monthly expenses"
                />
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Monthly Income</span>
                <span className="font-medium">₹{income.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Monthly Expenses</span>
                <span className="font-medium">₹{expenses.toLocaleString('en-IN')}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Disposable Income</span>
                  <span className="font-bold text-primary">₹{disposableIncome.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <Button className="w-full">
              Update Financial Details
            </Button>
          </CardContent>
        </Card>

        {/* Eligibility Result Card */}
        <Card className="shadow-card border-primary/20">
          <CardHeader className="bg-gradient-gov text-primary-foreground rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Your Loan Eligibility
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Eligible Loan Amount</p>
              <div className="text-4xl font-bold text-primary mb-2">
                ₹{(finalEligible / 100000).toFixed(1)}L
              </div>
              <p className="text-xs text-muted-foreground">
                (₹{finalEligible.toLocaleString('en-IN')})
              </p>
            </div>

            <div className="p-4 bg-success/10 rounded-lg border border-success/20">
              <div className="flex items-center gap-2 text-success font-medium mb-2">
                <CheckCircle2 className="h-5 w-5" />
                High Approval Chance (85%)
              </div>
              <p className="text-xs text-muted-foreground">
                Based on your credit score and financial profile
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm p-3 bg-muted rounded-lg">
                <span className="text-muted-foreground">Interest Rate</span>
                <Badge variant="outline">4.5% - 6.5%</Badge>
              </div>
              <div className="flex items-center justify-between text-sm p-3 bg-muted rounded-lg">
                <span className="text-muted-foreground">Loan Tenure</span>
                <Badge variant="outline">Up to 5 years</Badge>
              </div>
              <div className="flex items-center justify-between text-sm p-3 bg-muted rounded-lg">
                <span className="text-muted-foreground">Processing Fee</span>
                <Badge variant="outline">1% of loan amount</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Link to="/dashboard/profile">
                <Button className="w-full" size="lg">
                  Apply for Loan
                </Button>
              </Link>
              <p className="text-xs text-center text-muted-foreground">
                Complete your profile to apply
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <Card className="shadow-card mt-8">
        <CardHeader>
          <CardTitle>How is Eligibility Calculated?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Income Assessment</h4>
              <p className="text-sm text-muted-foreground">
                Your monthly income determines the base eligibility amount
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Expense Analysis</h4>
              <p className="text-sm text-muted-foreground">
                Lower expenses increase your disposable income and eligibility
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Credit Score Impact</h4>
              <p className="text-sm text-muted-foreground">
                Higher credit scores unlock better rates and higher amounts
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoanEligibility;
