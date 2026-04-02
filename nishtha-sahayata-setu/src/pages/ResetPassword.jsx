import { useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const ResetPassword = () => {
  const savedAadhaar = localStorage.getItem("reset_aadhaar");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post("http://localhost:5010/api/auth/reset-password", {
        aadhar_no: savedAadhaar,
        otp,
        new_password: newPassword,
      });

      if (res.data.message === "Password updated successfully") {
        localStorage.removeItem("reset_aadhaar");
        alert("Password updated! Please login again.");
        window.location.href = "/login";
      } else {
        setError(res.data.error || "Password reset failed");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Server error");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex justify-center items-center bg-muted/30 py-10">
        <Card className="w-full max-w-md shadow-elevated">
          <CardHeader>
            <CardTitle className="text-center">Create New Password</CardTitle>
          </CardHeader>

          <CardContent>
            <form className="space-y-4" onSubmit={handleReset}>
              <div>
                <Label>OTP</Label>
                <Input
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>

              <div>
                <Label>New Password</Label>
                <Input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full">Reset Password</Button>

              {error && <p className="text-red-500">{error}</p>}
            </form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default ResetPassword;
