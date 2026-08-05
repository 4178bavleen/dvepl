// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { InventoryField } from "@/pages/inventory/InventoryPage"; // adjust path

// interface Props {
//   field: InventoryField;
//   value: any;
//   onChange: (value: any) => void;
// }

// export default function FieldRenderer({ field, value, onChange }: Props) {
//   if (field.visible === false) return null;

//   switch (field.type) {
//     case "text":
//       return (
//         <div className="space-y-2">
//           <label className="text-sm font-medium">
//             {field.label}
//             {field.required && <span className="text-red-500">*</span>}
//           </label>

//           <Input
//             value={value ?? ""}
//             placeholder={field.placeholder}
//             onChange={(e) => onChange(e.target.value)}
//           />
//         </div>
//       );

//     case "number":
//       return (
//         <div className="space-y-2">
//           <label className="text-sm font-medium">{field.label}</label>

//           <Input
//             type="number"
//             value={value ?? ""}
//             onChange={(e) => onChange(Number(e.target.value))}
//           />
//         </div>
//       );

//     case "textarea":
//       return (
//         <div className="space-y-2">
//           <label className="text-sm font-medium">{field.label}</label>

//           <Textarea
//             value={value ?? ""}
//             onChange={(e) => onChange(e.target.value)}
//           />
//         </div>
//       );

//     case "select":
//       return (
//         <div className="space-y-2">
//           <label className="text-sm font-medium">
//             {field.label}
//             {field.required && <span className="text-red-500">*</span>}
//           </label>

//           <Select value={value ?? ""} onValueChange={onChange}>
//             <SelectTrigger>
//               <SelectValue placeholder={field.placeholder || "Select..."} />
//             </SelectTrigger>

//             <SelectContent>
//               {(Array.isArray(field.options)
//                 ? field.options
//                 : String(field.options || "")
//                     .split(",")
//                     .map((x) => x.trim())
//                     .filter(Boolean)
//               ).map((option: string) => (
//                 <SelectItem key={option} value={option}>
//                   {option}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//         </div>
//       );
//     default:
//       return null;
//   }
// }
