import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { Prisma } from "@prisma/client";

interface Params {
  id: string;
}



async function adminVendorDeleteRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {


fastify.delete(
  "/:id",
  {
    schema:{
      tags:["Vendor"],
      summary:"Delete Vendor",
      description:"Soft delete vendor"
    }
  },


async(
request: FastifyRequest<{Params:Params}>,
reply:FastifyReply
)=>{


try{


const {id}=request.params;



// ==========================
// Check Vendor Exists
// ==========================


const existingVendor =
await fastify.prisma.vendor.findFirst({

where:{
id,
deletedAt:null
}

});



if(!existingVendor){


return reply.status(404).send({

success:false,

message:"Vendor not found."

});


}




// ==========================
// Transaction
// ==========================


const deletedVendor =

await fastify.prisma.$transaction(

async(tx)=>{


// ==========================
// Soft Delete
// ==========================


const vendor =
await tx.vendor.update({

where:{
id
},


data:{


deletedAt:new Date(),


revisionCount:{
increment:1
}


}


});




// ==========================
// Create Revision
// ==========================


await tx.vendorRevision.create({

data:{


vendorId:id,


action:"DELETE",


oldData:
JSON.parse(
JSON.stringify(existingVendor)
),


newData: Prisma.JsonNull,


createdById:
request.user.id


}


});



return vendor;


}

);





adminLogs.info(
"Vendor deleted successfully",
{
vendorId:id
}
);





return reply.status(200).send({

success:true,

message:
"Vendor deleted successfully.",

data:deletedVendor

});



}catch(error:any){


console.error(error);



adminLogs.error(
"Vendor deletion failed",
{
error
}
);



return reply.status(500).send({

success:false,

message:
"Server error while deleting vendor.",


error:
process.env.NODE_ENV==="development"
?error.message
:undefined


});


}


}

);


}



export default adminVendorDeleteRoutes;