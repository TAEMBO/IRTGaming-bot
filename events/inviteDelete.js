module.exports = {
    name: "inviteCreate",
    execute: async (client, invite) =>{
        client.invites.delete(invite.code)
    }
}