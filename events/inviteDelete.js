module.exports = {
    name: "inviteDelete",
    execute: async (client, invite) =>{
        client.invites.delete(invite.code)
    }
}