import * as React from "react";
import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="py-20 flex items-center justify-center min-h-[calc(100vh-160px)] animate-fade-in-up">
      <div className="max-w-md w-full">
        <EmptyState
          icon={ShieldAlert}
          title="Clearance Required / Page Not Found"
          description="The requested platform link does not exist, or the corresponding compliance session has been archived."
          actionText="Return to Dashboard"
          onAction={() => {
            window.location.href = "/dashboard";
          }}
        />
      </div>
    </div>
  );
};
export default NotFoundPage;
