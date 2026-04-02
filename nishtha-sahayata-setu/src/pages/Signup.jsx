import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Shield } from "lucide-react";

const Signup = () => {
  const navigate = useNavigate();

  // Form Inputs
  const [aadhaar, setAadhaar] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [income, setIncome] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [occupation, setOccupation] = useState("");
  const [category, setCategory] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  // UI State
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const BASE_URL = "http://localhost:5010/api/auth/signup/create-account";

  const handleCreateAccount = async () => {
    setError("");
    setMsg("");

    if (!aadhaar || aadhaar.length !== 12)
      return setError("Enter a valid 12-digit Aadhaar number.");
    if (!name) return setError("Full Name is required.");
    if (!phone) return setError("Mobile number is required.");
    if (!category) return setError("Select caste category.");
    if (!password || !confirmPass) return setError("Enter password.");
    if (password !== confirmPass) return setError("Passwords do not match.");

    setLoading(true);

    try {
      const res = await axios.post(BASE_URL, {
        aadhaar_no: aadhaar,
        name,
        age,
        gender,
        phone_no: phone,
        address,
        income_yearly: income,
        state,
        district,
        occupation,
        password,
        caste: category,
      });

      setMsg("Account created successfully!");

      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create account.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">

            <Card className="shadow-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Create Your Account
                </CardTitle>
                <CardDescription>
                  Fill the details below to register as a beneficiary.
                </CardDescription>
              </CardHeader>

              <CardContent>
                {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
                {msg && <p className="text-green-600 text-sm mb-2">{msg}</p>}

                <div className="space-y-4">

                  <Label>Aadhaar Number</Label>
                  <Input
                    value={aadhaar}
                    onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ""))}
                    maxLength={12}
                    placeholder="Enter 12-digit Aadhaar"
                  />

                  <Label>Full Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                  />

                  <Label>Age</Label>
                  <Input
                    value={age}
                    onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter age"
                  />

                  <Label>Gender</Label>
                  <Select onValueChange={setGender}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>

                  <Label>Mobile Number</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />

                  <Label>Address</Label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />

                  <Label>Yearly Income</Label>
                  <Input
                    value={income}
                    onChange={(e) => setIncome(e.target.value.replace(/\D/g, ""))}
                  />

                  <Label>State</Label>
                  <Input
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />

                  <Label>District</Label>
                  <Input
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                  />

                  <Label>Occupation</Label>
                  <Input
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                  />

                  <Label>Caste Category</Label>
                  <Select onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SC">SC</SelectItem>
                      <SelectItem value="ST">ST</SelectItem>
                      <SelectItem value="OBC">OBC</SelectItem>
                    </SelectContent>
                  </Select>

                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  <Label>Confirm Password</Label>
                  <Input
                    type="password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                  />

                  <Button
                    onClick={handleCreateAccount}
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Create Account"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{" "}
              <Link to="/login" className="text-primary">Login</Link>
            </p>

          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Signup;
