// src/components/apply-loan/ProfileSidebar.jsx
import { CheckCircle2 } from "lucide-react";
import { profileSections } from "@/pages/ApplyLoan";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export const ProfileSidebar = ({
  selectedSection,
  setSelectedSection,
  completedSections,
}) => {
  return (
    <div className="flex flex-col gap-2 p-2 sticky top-4 self-start">
      {profileSections.map((section) => (
        <button
          key={section.id}
          onClick={() => setSelectedSection(section.id)}
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg transition-all text-left w-full hover:bg-muted/50",
            selectedSection === section.id
              ? "bg-primary/10 text-primary border-r-4 border-primary font-semibold"
              : "text-muted-foreground"
          )}
        >
          <section.icon
            className={cn(
              "h-5 w-5",
              completedSections.includes(section.id) && "text-success"
            )}
          />
          <span className="text-sm flex-1">{section.title}</span>
          {completedSections.includes(section.id) && (
            <CheckCircle2 className="h-4 w-4 text-success" />
          )}
        </button>
      ))}
    </div>
  );
};
export default ProfileSidebar;