const generateFile = (userName, fileToBeUploaded) => {
    return {
        userName,
        fileToBeUploaded,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    generateFile
}