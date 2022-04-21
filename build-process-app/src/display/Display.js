import React, { useEffect, useState } from "react";
import "./Display.css";
import io from "socket.io-client";
import { RenderSequence, RenderText } from "./Components"

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

