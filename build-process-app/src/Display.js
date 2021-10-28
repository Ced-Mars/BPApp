import React, { useEffect, useState } from "react";
import {List, ListItem, ListItemText, Card, CircularProgress } from "@mui/material";
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
    return <RenderSequence props={response} action={action} statut={statut} completedAction={completedAction} setCompletedAction={setCompletedAction} />;
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

function RenderSequence({ props, action, statut, completedAction, setCompletedAction }) {
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

  // Actions
  

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
    //Ou action
    console.log("dans useeffect action", isActionComplete(action));
    if(!isActionComplete(action)){
      handleCompleteAction();
    }
    console.log("action set ",completedAction);
  }, [action]);

  return (
      <div style={root}>
        
        <div style={content}>
          <List style={list}>
            {props.map((value, i, arr) => {
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
          <p>Action en cours : {action} - Statut : {statut}</p>
        </div>
      </div>
  );
}


