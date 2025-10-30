
import dynamic from "next/dynamic";
const AdminGuard = dynamic(() => import("../components/AdminGuard"), { ssr:false });
import AdminLayout from "../components/AdminLayout";
import Card from "../components/ui/Card";

export default function AdminHome(){
  return (
    <AdminGuard>
      <AdminLayout active="dashboard">
        <h1 className="page-title mb-4">Dashboard</h1>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="text-sm text-paa-700">Quick stats coming soon…</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-paa-700">Moderation queue snapshot…</div>
          </Card>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
