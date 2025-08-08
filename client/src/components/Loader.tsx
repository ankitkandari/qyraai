import { Loader2 } from "lucide-react";

const Loader = () => {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm text-slate-600">Loading...</p>
            </div>
        </div>
    )
}

export default Loader;