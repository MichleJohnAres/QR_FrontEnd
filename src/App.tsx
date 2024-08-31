import React, { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import axios from "axios";

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [output, setOutput] = useState<string>("Scanning...");

  interface ReturnData {
    submissionDate: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    eMail: string;
    products: string;
    uniqueId: string;
    total: number;
  }

  interface ApiResponse {
    ok: string;
    message: string;
    returndata: ReturnData;
  }

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    // Access the camera
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (video) {
          video.srcObject = stream;
          video.play();
          requestAnimationFrame(scanQRCode);
        }
      })
      .catch((error) => {
        console.error("Error accessing camera: ", error);
        setOutput("Error accessing camera.");
      });

    const scanQRCode = () => {
      if (context && video && canvas) {
        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

        // Decode QR code
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

        if (qrCode) {
          let outstr = `QR Code detected: ${qrCode.data}`;
          axios
            .get<ApiResponse>(
              `https://503f-158-51-123-17.ngrok-free.app/read?UNICODE=${qrCode.data}`
            )
            .then((response) => {
              const data = response.data;
              if (data.ok === "false") {
                outstr += `\n${data.message}`;
              } else {
                outstr +=
                  "\n" +
                  "Submission date: " +
                  data.returndata.submissionDate +
                  "\n" +
                  "First Name: " +
                  data.returndata.firstName +
                  "\n" +
                  "Last Name: " +
                  data.returndata.lastName +
                  "\n" +
                  "Phone Number: " +
                  data.returndata.phoneNumber +
                  "\n" +
                  "Email: " +
                  data.returndata.eMail +
                  "\n" +
                  "Products: " +
                  data.returndata.products +
                  "\n" +
                  "Unique ID: " +
                  data.returndata.uniqueId +
                  "\n" +
                  "Total:  " +
                  data.returndata.total;
              }

              // Do something with outstr, like logging or displaying it
            })
            .catch((err) => console.log(err));
          setOutput(outstr);
        } else {
          setOutput("Scanning...");
          requestAnimationFrame(scanQRCode); // Continue scanning
        }
      }
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        margin: 0,
      }}>
      <h1>QR Code Scanner</h1>
      <video
        ref={videoRef}
        style={{ width: 640, height: 480 }}
        autoPlay></video>
      <canvas
        ref={canvasRef}
        style={{ display: "none", width: 640, height: 480 }}></canvas>
      <div id="output" style={{ marginTop: 20, fontSize: "1.5em" }}>
        {output}
      </div>
    </div>
  );
};

export default App;
