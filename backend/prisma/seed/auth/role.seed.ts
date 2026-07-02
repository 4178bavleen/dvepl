
export async function seedRole(prisma: any, companyId: string) {
return prisma.role.upsert({
    where:{
        companyId_name:{
            companyId,
            name:"Admin"
        }
    },
    update:{},
    create:{
        companyId,
        name:"Admin",
        isSystem:true
    }
})
}