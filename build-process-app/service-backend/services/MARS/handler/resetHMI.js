function handleResetHMI(socket){
    activeStep = activeStepToZero();
    message = resetBuildProcessData();
    socket.emit("ResetFromBackend", "reset");
}

function activeStepToZero(){
    return 0;
}

function resetBuildProcessData(){
    return [];
}

module.exports = handleResetHMI;