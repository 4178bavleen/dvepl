// import React, { useEffect, useMemo, useState } from "react";
// import {
//   PackageSearch,
//   RefreshCw,
//   Search,
//   Download,
//   AlertTriangle,
// } from "lucide-react";

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";

// import { toast } from "react-hot-toast";
// import { apiClient } from "@/services/axios";


// interface InventoryTrackingItem {
//   poId: string;
//   poNo: string;

//   vendorId: string;
//   vendor: string;

//   materialId: string;
//   material: string;

//   category: string | null;

//   orderedQty: number;
//   receivedQty: number;
//   pendingQty: number;

//   unit: string;

//   status: "RECEIVED" | "PENDING" | "PARTIAL";

//   expectedDelivery: string | null;

//   delayed: boolean;
//   delayDays: number;
// }


// const InventoryTrackingPage = () => {


//   const [tracking,setTracking] =
//     useState<InventoryTrackingItem[]>([]);


//   const [loading,setLoading] =
//     useState(false);


//   const [search,setSearch] =
//     useState("");


//   const [status,setStatus] =
//     useState("");


//   const fetchTracking = async()=>{

//     try{

//       setLoading(true);

//       const res = await apiClient.get(
//         "/inventory/tracking"
//       );


//       setTracking(
//         res.data.data || []
//       );


//     }catch(error:any){

//       console.log(error);

//       toast.error(
//         "Failed to load inventory tracking"
//       );

//     }
//     finally{
//       setLoading(false);
//     }

//   };


//   useEffect(()=>{
//     fetchTracking();
//   },[]);



//   const filteredTracking =
//     useMemo(()=>{

//       return tracking.filter((item)=>{

//         const text =
//         `${item.poNo}
//         ${item.vendor}
//         ${item.material}`
//         .toLowerCase();


//         const matchesSearch =
//         text.includes(
//           search.toLowerCase()
//         );


//         const matchesStatus =
//         status
//         ? item.status === status
//         : true;


//         return (
//           matchesSearch &&
//           matchesStatus
//         );

//       });


//     },[
//       tracking,
//       search,
//       status
//     ]);



//   const kpis = {

//     total:
//       tracking.length,

//     pending:
//       tracking.filter(
//         i=>i.status==="PENDING"
//       ).length,


//     partial:
//       tracking.filter(
//         i=>i.status==="PARTIAL"
//       ).length,


//     delayed:
//       tracking.filter(
//         i=>i.delayed
//       ).length

//   };