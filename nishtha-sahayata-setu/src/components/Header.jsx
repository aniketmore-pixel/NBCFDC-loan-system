import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, Globe } from "lucide-react";
import { useState, useEffect } from "react";

export const Header = () => {
  const [language, setLanguage] = useState("English");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token"); // Clear session data
    setIsLoggedIn(false);
    navigate("/login"); // Redirect to login page
  };

  

  return (
    <header className="fixed top-0 left-0 right-0
    z-50
    h-16
    border-b border-border
    bg-background   /* fully opaque background */">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Title */}
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full overflow-hidden">
              <img
                src="/placeholder.svg"
                alt="Logo"
                className="h-full w-full object-cover"
              />
            </div>


            <div className="hidden md:block">
              <div className="text-sm font-semibold text-primary">National Backward Classes</div>
              <div className="text-xs text-muted-foreground">Finance & Development Corporation</div>
            </div>
          </Link>

      {/* Nav
      <nav className="hidden md:flex items-center gap-6">
        <Link className="text-sm font-medium hover:text-primary" to="/">Home</Link>
        <Link className="text-sm font-medium hover:text-primary" to="/schemes">Schemes</Link>
        <Link className="text-sm font-medium hover:text-primary" to="/about">About</Link>
        <Link className="text-sm font-medium hover:text-primary" to="/contact">Contact</Link>
      </nav> */}

      {/* Right Section */}
      <div className="flex items-center gap-3">
        

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-2">
          {isLoggedIn ? (
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline" size="sm">Login</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Register</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    </div>
  </div>
</header>

  );
};
