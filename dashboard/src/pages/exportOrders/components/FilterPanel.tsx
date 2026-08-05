import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";

import { Input } from "@/components/ui/input";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function FilterPanel() {
    return (
        <Card>

            <CardHeader>
                <CardTitle>
                    Filter Orders
                </CardTitle>
            </CardHeader>

            <CardContent>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">

                    <Input
                        placeholder="Sales Order No"
                    />

                    <Input
                        placeholder="Customer"
                    />

                    <Select>

                        <SelectTrigger>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>

                        <SelectContent>

                            <SelectItem value="all">
                                All
                            </SelectItem>

                            <SelectItem value="draft">
                                Draft
                            </SelectItem>

                            <SelectItem value="pending">
                                Pending
                            </SelectItem>

                            <SelectItem value="approved">
                                Approved
                            </SelectItem>

                            <SelectItem value="completed">
                                Completed
                            </SelectItem>

                        </SelectContent>

                    </Select>

                    <Input
                        placeholder="Assigned Engineer"
                    />

                    <Input
                        type="date"
                    />

                    <Input
                        type="date"
                    />

                </div>

                <div className="flex justify-end mt-6">

                    <Button className="gap-2">

                        <Search className="w-4 h-4" />

                        Preview Orders

                    </Button>

                </div>

            </CardContent>

        </Card>
    );
}