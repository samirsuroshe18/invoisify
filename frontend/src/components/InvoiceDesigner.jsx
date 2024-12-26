import React, { useRef, useEffect } from 'react';
import { fabric } from 'fabric-js';
import QRCode from 'qrcode';

const InvoiceDesigner = () => {
//   const canvasRef = useRef(null);

//   useEffect(() => {
//     const canvas = new fabric.Canvas(canvasRef.current);
//     canvas.setHeight(600);
//     canvas.setWidth(800);

//     const title = new fabric.Text('Company Name', {
//       left: 50,
//       top: 50,
//       fontSize: 30,
//       fill: '#000',
//       fontFamily: 'Arial',
//     });
//     canvas.add(title);


//     fabric.Image.fromURL('https://via.placeholder.com/150', (img) => {
//       img.set({ left: 300, top: 50 });
//       canvas.add(img);
//     });


//     QRCode.toDataURL('Invoice ID: 12345', { errorCorrectionLevel: 'H' })
//       .then((url) => {
//         fabric.Image.fromURL(url, (img) => {
//           img.set({ left: 650, top: 50, width: 100, height: 100 });
//           canvas.add(img);
//         });
//       });

//     const itemText = new fabric.Text('Item: 1 | Price: $100', {
//       left: 50,
//       top: 150,
//       fontSize: 20,
//       fill: '#333',
//     });
//     canvas.add(itemText);

//     return () => {
//       canvas.dispose();
//     };
//   }, []);

//   return <canvas ref={canvasRef} />;
};

export default InvoiceDesigner;
