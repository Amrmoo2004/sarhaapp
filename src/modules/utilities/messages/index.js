//generate func
const generateMessage = (entity) => (
     {
        notfound: `${entity} not found`,
        alreadyExists: `${entity} already exists`,
        createdSuccessfully:`${entity} created successfully`,
        updatedSuccessfully:`${entity} updated successfully`,
        deletedSuccessfully:`${entity} deleted successfully`,
        failToCreate:`fail to create ${entity}`,
        failToUpdate:`fail to update ${entity}`,
        failToDelete:`fail to delete ${entity}`,

    }
)

//messages
export const messages={
user:{...generateMessage("user"),invalidEorP:"invalid email or password"},
users:generateMessage("users"),
message:generateMessage("message"),
messages:generateMessage("messages"),
}
