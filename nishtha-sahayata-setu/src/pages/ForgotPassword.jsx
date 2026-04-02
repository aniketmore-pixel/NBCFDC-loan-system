import { useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const ForgotPassword = () => {
  const [aadhaar, setAadhaar] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const res = await axios.post("http://localhost:5010/api/auth/forgot-password", {
        aadhar_no: aadhaar,
      });

      if (res.data.message === "OTP sent for password reset") {
        localStorage.setItem("reset_aadhaar", aadhaar);
        window.location.href = "/reset-password";
      } else {
        setError(res.data.error || "Failed to send OTP");
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
            <CardTitle className="text-center">Reset Password</CardTitle>
          </CardHeader>

          <CardContent>
            <form className="space-y-4" onSubmit={handleSendOtp}>
              <div>
                <Label>Aadhaar Number</Label>
                <Input
                  placeholder="Enter your Aadhaar"
                  value={aadhaar}
                  onChange={(e) => setAadhaar(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full">Send OTP</Button>

              {message && <p className="text-green-600">{message}</p>}
              {error && <p className="text-red-500">{error}</p>}
            </form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default ForgotPassword;
