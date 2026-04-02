// src/components/StatCard.jsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const StatCard = ({ title, value, icon: Icon, trend, variant = "default" }) => {
  const variantClasses = {
    default: "text-primary",
    success: "text-success",
    warning: "text-warning",
  };

  return (
    <Card className="shadow-card hover:shadow-elevated transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-5 w-5 ${variantClasses[variant]}`} />
      </CardHeader>

      <CardContent>
        <div className="text-3xl font-bold text-foreground">{value}</div>

        {trend && (
          <p className="text-xs text-muted-foreground mt-1">{trend}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
