import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { apiClient } from "@/services/axios";

export default function VendorTracking() {


  const [data,setData] = useState<any[]>([]);
  const [search,setSearch] = useState("");

  const [loading,setLoading] = useState(false);



  const fetchTracking = async()=>{

    try{

      setLoading(true);

      const res =
        await apiClient.inventory.vendorTracking.list();


      setData(res.data || []);

    }
    catch(err){

      console.error(err);

    }
    finally{

      setLoading(false);

    }

  };



  useEffect(()=>{

    fetchTracking();

  },[]);



  const filteredData =
    data.filter((item)=>{

      const value =
      `${item.vendor?.name}
       ${item.material?.name}
       ${item.poNo}`
       .toLowerCase();


      return value.includes(
        search.toLowerCase()
      );

    });



return (

<div className="space-y-5">


<div className="flex justify-between">

<h2 className="text-xl font-semibold">
Vendor Order Tracking
</h2>


<div className="flex items-center border rounded px-3">

<Search size={18}/>

<input
className="outline-none p-2"
placeholder="Search vendor/material"
value={search}
onChange={(e)=>
 setSearch(e.target.value)
}
/>

</div>


</div>





<div className="overflow-x-auto border rounded">


<table className="w-full">


<thead>

<tr className="bg-gray-100">


<th className="p-3 text-left">
PO No
</th>


<th className="p-3 text-left">
Vendor
</th>


<th className="p-3 text-left">
Material
</th>


<th className="p-3">
Ordered
</th>


<th className="p-3">
Received
</th>


<th className="p-3">
Pending
</th>


<th className="p-3">
Status
</th>


</tr>

</thead>



<tbody>


{
filteredData.map((item)=>(
<tr key={item.poId}>


<td className="p-3">
{item.poNo}
</td>


<td className="p-3">
{item.vendor?.name}
</td>


<td className="p-3">
{item.material?.name}
</td>


<td className="p-3 text-center">
{item.orderedQty}
</td>


<td className="p-3 text-center">
{item.receivedQty}
</td>


<td className="p-3 text-center">
{item.pendingQty}
</td>


<td className="p-3 text-center">

<span>

{item.status}

</span>

</td>


</tr>
))
}


</tbody>


</table>

</div>


</div>

);

}