import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";

export default function SelectedOrdersCard() {
    return (
        <Card>

            <CardHeader>
                <CardTitle>
                    Selected Orders
                </CardTitle>
            </CardHeader>

            <CardContent>

                <div className="grid grid-cols-4 gap-4">

                    <div className="rounded-lg border p-4">

                        <p className="text-sm text-muted-foreground">
                            Orders
                        </p>

                        <p className="text-3xl font-bold">
                            0
                        </p>

                    </div>

                    <div className="rounded-lg border p-4">

                        <p className="text-sm text-muted-foreground">
                            Quantity
                        </p>

                        <p className="text-3xl font-bold">
                            0
                        </p>

                    </div>

                    <div className="rounded-lg border p-4">

                        <p className="text-sm text-muted-foreground">
                            Value
                        </p>

                        <p className="text-3xl font-bold">
                            ₹0
                        </p>

                    </div>

                    <div className="rounded-lg border p-4">

                        <p className="text-sm text-muted-foreground">
                            Drawings
                        </p>

                        <p className="text-3xl font-bold">
                            0
                        </p>

                    </div>

                </div>

            </CardContent>

        </Card>
    );
}