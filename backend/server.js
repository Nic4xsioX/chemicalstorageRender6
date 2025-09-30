require("dotenv").config(); // โหลด environment variables
const express = require("express");
const cors = require("cors");
const path = require("path");
const { ConnectDB } = require("./Config/db.js");
const cron = require("node-cron");

const StorageRoutes = require("./Routes/Storage.Routes.js");
const BarcodeRoutes = require("./Routes/Barcode.Routes.js");
const LogRoutes = require("./Routes/Log.Routes.js");
const Chemical_ReturnsRoutes = require("./Routes/Chemical_Returns.Routes.js");
const NotificationRoutes = require("./Routes/Notification.Routes.js");
const UserloginRoutes = require("./Routes/Userlogin.Routes.js");
const WebRoutes = require("./Routes/Web.Routes.js");

const BarcodeModels = require("./Models/Barcode.Models.js");
const NotificationModels = require("./Models/Notification.Models.js");

const SendNotification = require("./Utils/SendNotification.js");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
ConnectDB(); 

// ✅ เสิร์ฟไฟล์ static ของ frontend
app.use("/assets", express.static(path.join(__dirname, "../frontend/assets")));
app.use("/HTML", express.static(path.join(__dirname, "../frontend/HTML")));
app.use("/CSS", express.static(path.join(__dirname, "../frontend/CSS")));
app.use("/JS", express.static(path.join(__dirname, "../frontend/JS")));
app.use(express.static(path.join(__dirname, "../public")));

// ✅ เสิร์ฟ index.html เวลาเข้าที่ root "/"
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/HTML/home.html"));
});
app.get('/noti', (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/HTML/notification.html"));
});
app.get('/logdata', (req, res) => {
  res.sendFile(path.join(__dirname,  "../frontend/HTML/logdata.html"));
});
app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname,  "../frontend/HTML/home.html"));
});
app.get('/create_barcode.html', (req, res) => {
  res.sendFile(path.join(__dirname,  "../frontend/HTML/create_barcode.html"));
});
app.get('/Print_barcode.html', (req, res) => {
  res.sendFile(path.join(__dirname,  "../frontend/HTML/Print_barcode.html"));
});



// ใช้งาน route ต่าง ๆ
app.use("/Storage", StorageRoutes);
app.use("/Barcode", BarcodeRoutes);
app.use("/Log", LogRoutes);
app.use("/Chemical_Returns", Chemical_ReturnsRoutes);
app.use("/Userlogin", UserloginRoutes);
app.use("/Notifications", NotificationRoutes);
app.use("/Web", WebRoutes);

// Cron job ลบ notification + ตรวจสอบวันหมดอายุ
cron.schedule("0 0 * * *", async () => {
  const RecieveEmail = "wanGod2007@gmail.com";
  try {
    await NotificationModels.DeleteAll();
    const Barcodes = await BarcodeModels.GetAllData();
    const datanow = new Date();

    for (const Barcode of Barcodes) {
      const expiredDate = new Date(Barcode.expireddate);
      const diffInMs = expiredDate - datanow;
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24); 

      const RemainWeek = 3;
      if (diffInDays < 7 * RemainWeek) {
        const dataToInsert = {
          name: Barcode.name,
          barcode: Barcode.barcode,
          expire_date: expiredDate,
          date_remain: Math.ceil(diffInDays),
        };
        await NotificationModels.InsertData(dataToInsert); 
        console.log(
          `บันทึกการแจ้งเตือน: ${Barcode.name} (เหลือ ${Math.ceil(
            diffInDays
          )} วัน)`
        );
      }
    }
    await SendNotification.exportPDF(RecieveEmail);
  } catch (error) {
    console.error("Error checking expiration or inserting notification:", error);
  }
});

// เริ่มต้น server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
