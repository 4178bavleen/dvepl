import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

import {
  vendorSchema,
} from "../../../schemas/admin/vendor/vendor.schema";


interface Params {
  id:string;
}



async function adminVendorUpdateRoutes(
  fastify:FastifyInstance,
  options:FastifyPluginOptions
){


fastify.patch(
  "/:id",
  {
    schema:{
      tags:["Vendor"],
      summary:"Update Vendor",
      description:"Update vendor details"
    }
  },


async(
 request:FastifyRequest<{Params:Params}>,
 reply:FastifyReply
)=>{


try{


const {id}=request.params;



// ==========================
// Validate Body
// ==========================


const validationResult =
vendorSchema.safeParse(request.body);



if(!validationResult.success){


return reply.status(400).send({

success:false,

message:"Invalid vendor data.",

error:
validationResult.error.issues

});


}



const {

companyId,

name,

category,

contactPerson,

phone,

email,

gstNumber,

address,

notes,


}=validationResult.data;




// ==========================
// Existing Vendor
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
// GST Duplicate Check
// ==========================


if(gstNumber){


const duplicateGST =
await fastify.prisma.vendor.findFirst({

where:{

gstNumber,

id:{
not:id
},

deletedAt:null

}

});


if(duplicateGST){


return reply.status(409).send({

success:false,

message:"GST Number already exists."

});


}


}




// ==========================
// Transaction
// ==========================


const updatedVendor =

await fastify.prisma.$transaction(

async(tx)=>{


// ==========================
// Update Vendor
// ==========================


const vendor =
await tx.vendor.update({

where:{
id
},


data:{


companyId,


name,


category:
category ?? null,


contactPerson:
contactPerson ?? null,


phone:
phone ?? null,


email:
email ?? null,


gstNumber:
gstNumber ?? null,


address:
address ?? null,


notes:
notes ?? null,


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


action:"UPDATE",


oldData:
JSON.parse(
JSON.stringify(existingVendor)
),


newData:
JSON.parse(
JSON.stringify(vendor)
),


createdById:
request.user.id


}


});




return vendor;



}

);




// ==========================
// Response
// ==========================


adminLogs.info(
"Vendor updated successfully",
{
vendorId:id
}
);



return reply.status(200).send({

success:true,

message:
"Vendor updated successfully.",

data:updatedVendor


});



}catch(error:any){


console.error(error);


adminLogs.error(
"Vendor update failed",
{
error
}
);



return reply.status(500).send({

success:false,

message:
"Server error while updating vendor.",

error:
process.env.NODE_ENV==="development"
?error.message
:undefined


});


}


}

);


}


export default adminVendorUpdateRoutes;