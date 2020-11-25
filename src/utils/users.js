const users = []

const addUser = ({ id, userName }) => {
    // Validate the data
    if (!userName) {
        return {
            error: 'Username is required!'
        }
    }

    // Check for existing user
    const existingUser = users.find((user) => {
        return user.userName === userName
    })

    // Validate username
    if (existingUser) {
        return {
            error: 'Username is in use!'
        }
    }

    // Store user
    const user = { id, userName }
    users.push(user)

    return user;
}

const removeUser = (id) => {
    const index = users.findIndex((user) => user.id === id)

    if (index !== -1) {
        return users.splice(index, 1)[0]
    }
}

const getUser = (id) => {
    return users.find((user) => user.id === id)
}

const getUsersInChat = () => {
    return users
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInChat
}