import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8">
        <div className="bg-destructive/10 text-destructive p-4 rounded-full inline-block mb-4">
          <AlertCircle className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">404 Page Not Found</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          We couldn't find the page you were looking for. It might have been moved or doesn't exist.
        </p>
        <Link href="/" className="inline-block mt-8 px-6 py-3 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200">
          Return Home
        </Link>
      </div>
    </div>
  );
}
