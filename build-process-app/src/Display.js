import React, { useEffect, useState } from "react";
import {List, ListItem, ListItemText, Stepper, Step, StepButton, Button, Typography, CircularProgress, StepLabel } from "@mui/material";
import "./Display.css";
import socketIOClient from "socket.io-client";

const ENDPOINT = "http://127.0.0.1:4001";
const socket = socketIOClient(ENDPOINT);



//Fonctionnement avec socket
export default function Display() {
  const [response, setResponse] = useState([]);
  const [action, setAction] = useState("");
  const [statut, setStatut] = useState("");
  const [completedAction, setCompletedAction] = React.useState(new Set());
  const [activeStep, setActiveStep] = React.useState(0);
  const [completedStep, setCompletedStep] = React.useState(new Set());

  
  useEffect(() => {
    socket.on("FromBPAll", (a) => {
      setResponse(a);
      setCompletedAction(new Set());
    });
    socket.on("FromBPAdv", (a) => {
      setAction(a["id"]);
      setStatut(a["status"]);
    });
    // CLEAN UP THE EFFECT
    return () => socket.disconnect();
  }, [socket]);

  
  if (response && response.length!==0 && response!== "Attente de la Recette") {
    console.log("dans render sequence");
    return <RenderSequence 
    props={response} 
    setProps={setResponse}
    action={action} 
    statut={statut} 
    completedAction={completedAction} 
    setCompletedAction={setCompletedAction}
    activeStep={activeStep}
    setActiveStep={setActiveStep}
    completedStep={completedStep}
    setCompletedStep={setCompletedStep} />;
  }
  return <RenderText props={response} />;
  
}


function RenderText({ props }) {
  const divStyle = {
    color: "blue",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  };
  return (
    <div style={divStyle}>
      <CircularProgress />
      <p>{props}</p>
    </div>
    
  );
}





function RenderSequence({ 
  props,
  setProps,
  action, 
  statut, 
  completedAction, 
  setCompletedAction,
  activeStep,
  setActiveStep,
  completedStep,
  setCompletedStep 
}) {
  const root = {
    flex:1,
    width: "100%",
    display: "flex",
    flexDirection: "column",
  };
  const footer = {
    display:"flex",
    flexDirection:"column",
    alignContent:"stretch",
    marginBottom:"10px",
    flex: "0 0 auto"
  };
  const content = {
    flex: "1 0 auto",
    display:"flex",
    alignItems:"stretch",
    height:"0px"
  };
  const list = {
    flex:1,
    display:"flex",
    flexDirection:"column",
    overflow:"auto",
    margin:"5px",
    padding:"5px"
  };
  const stepper = {
    flex: "1 0 auto"
  };

  // Gestion Actions
  const handleCompleteAction = () => {
    console.log("dans handlecompleteaction", action);
    const newCompleted = new Set(completedAction);
    newCompleted.add(action);
    setCompletedAction(newCompleted);
  };

  function isActionComplete(action) {
    return completedAction.has(action);
  };

  useEffect(() => {
    if(!isActionComplete(action)){
      handleCompleteAction();
    }
  }, [action]);

  //Gestion Steps
  const totalSteps = () => {
    return props.length;
  };

  //return an array of string representing each step id and "End" string
  function getSteps(props) {
    var array = [];
    props.map((value, index) => {
      array = [...array, index+1];
    })

    return array;
  }

  function isStepComplete(step) {
    return completedStep.has(step);
  }

  const completedSteps = () => {
    return Object.keys(completedStep).length;
  };

  const isLastStep = () => {
    return activeStep === totalSteps() - 1;
  };

  const allStepsCompleted = () => {
    return completedSteps() === totalSteps();
  };

  const handleNext = () => {
    setActiveStep(activeStep + 1);
  };

  const handleStep = (step) => () => {
    setActiveStep(step);
  };

  const handleComplete = () => {
    const newCompleted = completed;
    newCompleted[activeStep] = true;
    setCompletedStep(newCompleted);
    handleNext();
  };

  //Reset everything
  const handleReset = () => {
    setActiveStep(0);
    setCompletedStep(new Set());
    setProps([]);
    setCompletedAction(new Set());
    setAction("");
    setStatut("");
  };

  //Get back to the active (working) step/action
  const handleFollow = () => {

  }

  

  return (
      <div style={root}>
        <Stepper alternativeLabel nonLinear activeStep={activeStep}>
          {getSteps(props).map((label, index) => {
            return (
              <Step key={index} completed={isStepComplete(index)}>
                <StepButton
                  focusRipple={true}
                  onClick={handleStep(index)}
                >
                  <StepLabel>
                    {label}
                  </StepLabel>
                </StepButton>
              </Step>
            );
          })}
        </Stepper>
        
        <div style={content}>
          <List style={list}>
            {props[activeStep].map((value, i, arr) => {
              return(
                  <ListItem button key={value["id"]} style={isActionComplete(value["id"]) ? {flex:1, backgroundColor:"lightgreen"} : {flex:1}}> 
                    <ListItemText primary={value["description"]}>
                    </ListItemText>
                  </ListItem>
              );
            })}
          </List>
          
        </div>

        <div style={footer}>
          {allStepsCompleted() ? (
            <div className={classes.footerData}>
              <Typography className={classes.instructions}>
                Process has ended, you can reset it or launch a new process.
              </Typography>
              <Button onClick={handleReset}>Reset</Button>
            </div>
            ) : 
            <p>Action en cours : {action} - Statut : {statut}</p>
          }
        </div>
      </div>
  );
}


