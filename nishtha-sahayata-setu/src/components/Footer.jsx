import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="font-semibold text-primary mb-3">About NBCFDC</h3>
            <p className="text-sm text-muted-foreground">
              National Backward Classes Finance and Development Corporation empowers backward class communities through financial assistance and development programs.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-primary mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/schemes" className="text-muted-foreground hover:text-primary transition-colors">
                  Schemes & Benefits
                </Link>
              </li>
              <li>
                <Link to="/eligibility" className="text-muted-foreground hover:text-primary transition-colors">
                  Eligibility Criteria
                </Link>
              </li>
              <li>
                <Link to="/apply" className="text-muted-foreground hover:text-primary transition-colors">
                  Apply for Loan
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-primary mb-3">Contact Us</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                support@nbcfdc.gov.in
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                1800-XXX-XXXX (Toll Free)
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                New Delhi, India
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-center text-sm text-muted-foreground">
          <p>© 2025 National Backward Classes Finance and Development Corporation. All rights reserved.</p>
          <p className="mt-1">Ministry of Social Justice and Empowerment, Government of India</p>
        </div>
      </div>
    </footer>
  );
};
