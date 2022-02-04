import React, { useEffect, useState } from "react";
import {List, ListItem, ListItemText, Stepper, Step, StepButton, Button, Typography, CircularProgress, StepLabel, ListItemButton, Card } from "@mui/material";
import "./Display.css";
import io from "socket.io-client";

//Fonctionnement avec socket
export default function Display() {
  const ENDPOINT = "http://127.0.0.1:4001";
  const [socket, setSocket] = useState(null);
  const [response, setResponse] = useState([]);
  const [action, setAction] = useState("");
  const [statut, setStatut] = useState("");
  const [activeStep, setActiveStep] = React.useState(0);
  const [end, setEnd] = React.useState(false);
  const [percentage, setPercentage] = React.useState(0);

  useEffect(() => {
    setSocket(io(ENDPOINT, {transports : ['websocket']}));
    return () => io(ENDPOINT).close();
  }, []);
  
  useEffect(() => {
    if(socket){
      socket.on("connect", () => {
        console.log("connected");
      });
      socket.on("FromBPAll", (a) => {
        console.log("réponse reçue", a);
        setResponse(a);
      });
      socket.on("FromBPAdv", (a) => {
        setAction(a["id"]);
        setStatut(a["status"]);
      });
      socket.on("ActiveStep", (a) => {
        setActiveStep(a);
      });
      socket.on("ResetFromBackend", (a) => {
        setActiveStep(0);
        setResponse([]);
        setAction("");
        setStatut("");
      });
      socket.on("Percentage", (a) => {
        setPercentage((a*100).toFixed(0));
      });
      // CLEAN UP THE EFFECT
      return () => socket.disconnect();
    }
  }, [socket]);


  
  if (response && response.length!==0) {
    return <RenderSequence 
    props={response} 
    setProps={setResponse}
    action={action} 
    setAction={setAction}
    statut={statut} 
    setStatut={setStatut}
    activeStep={activeStep}
    setActiveStep={setActiveStep}
    end={end}
    setEnd={setEnd}
    socket={socket}
    percentage={percentage}
    />
  }
  return <RenderText />;
  
}


function RenderText() {
  const divStyle = {
    color: "blue",
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  };
  return (
    <div style={divStyle}>
      <CircularProgress />
      <p>En attente de la recette</p>
    </div>
    
  );
}


function RenderSequence({ 
  props,
  setProps,
  action,
  setAction,
  statut,
  setStatut,
  activeStep,
  setActiveStep,
  end,
  setEnd,
  socket,
  percentage
}) {
  const root = {
    flex:1,
    width: "100%",
    display: "flex",
    flexDirection: "column",
  };
  const footer = {
    display:"flex",
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
    padding:"5px",
  };
  const cardlistitems = {
    flex:1,
    marginTop:"3px",
  };
  const listitems = {
    flex:1,
  };
  const stepper = {
    flex: "1 0 auto"
  };
  const instructions = {
    flex: 1
  };
  const footerReset = {
    flex: 1
  };

  //Reset everything
  const handleReset = () => {
    setActiveStep(0);
    setProps([]);
    setAction("");
    setStatut("");
    setEnd(false);
    socket.emit("ResetFromClient", "reset");
  };


  return (
      <div style={root}>
        <div style={content}>
          <List style={list}>
            {props.map((value, i, arr) => {
              return(
                <Card style={{flex:1, marginTop:"3px", backgroundColor: i == activeStep ? 'lightblue' : value.status == "SUCCESS" ? 'lightgreen' : 'lightgrey'}}>
                  <ListItem key={i} style={listitems}> 
                    <ListItemText primary={`${value["target"]} Action`} style={listitems}>
                    </ListItemText>
                      {value.target == "USER" ? i == activeStep ? <div style={listitems}><Button>Valider</Button> </div> : <div style={listitems}></div> : i == activeStep ? <div style={listitems}>{percentage} %</div> : <div style={listitems}></div> }
                      <div style={listitems}>{value["status"]}</div>
                  </ListItem>
                </Card>
              );
            })}
          </List>
          
        </div>

          {end ? (
            <div style={footer}>
              <Typography style={instructions}>
                Process has ended, you can reset it or launch a new process.
              </Typography>
              <Button onClick={handleReset} style={footerReset}>Reset</Button>
            </div>
            ) : 
            <div style={footer}>
              <Typography style={instructions}>
                Action en cours : {action} - Statut : {statut}
              </Typography>
              
            </div>
          }
        </div>
  );
}


