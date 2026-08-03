import { Checkbox } from "@/components/ui/checkbox";

const data = [
  {
    id: "1",
    soNo: "SO-2026-001",
    customer: "ABC Industries",
    status: "Pending",
    amount: "₹2,45,000",
    delivery: "12 Aug 2026",
  },
  {
    id: "2",
    soNo: "SO-2026-002",
    customer: "XYZ Pvt Ltd",
    status: "Approved",
    amount: "₹5,90,000",
    delivery: "18 Aug 2026",
  },
];

export default function OrdersTable() {
  return (
    <div className="rounded-lg border bg-background overflow-hidden">

      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-lg font-semibold">
          Matching Orders
        </h2>

        <span className="text-sm text-muted-foreground">
          {data.length} Orders
        </span>
      </div>

      <div className="overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="bg-muted">

            <tr>

              <th className="w-12 px-4 py-3 text-left">
                <Checkbox />
              </th>

              <th className="px-4 py-3 text-left">
                SO Number
              </th>

              <th className="px-4 py-3 text-left">
                Customer
              </th>

              <th className="px-4 py-3 text-left">
                Status
              </th>

              <th className="px-4 py-3 text-left">
                Amount
              </th>

              <th className="px-4 py-3 text-left">
                Delivery
              </th>

            </tr>

          </thead>

          <tbody>

            {data.map((row) => (

              <tr
                key={row.id}
                className="border-t hover:bg-muted/40 transition-colors"
              >

                <td className="px-4 py-3">
                  <Checkbox />
                </td>

                <td className="px-4 py-3 font-medium">
                  {row.soNo}
                </td>

                <td className="px-4 py-3">
                  {row.customer}
                </td>

                <td className="px-4 py-3">
                  {row.status}
                </td>

                <td className="px-4 py-3">
                  {row.amount}
                </td>

                <td className="px-4 py-3">
                  {row.delivery}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}