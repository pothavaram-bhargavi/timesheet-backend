const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.post('/addEmpTimeSheet', async (req, res) => {
    const{ name,daterange,timesheetsRows,totalhours} =req.body;
 
 console.log('name',name,'daterange',daterange,'timesheetsRows',timesheetsRows,'totalhours',totalhours)
 
 const job = await prisma.employee.create({
    data:{
     name:req.body.name,
     daterange:req.body.daterange,
     totalhours:req.body.totalhours,
     timesheetsRows:{
         createMany:{ 
          data:req.body.timesheetsRows
         }
         
     }
    }
  });
  console.log(job);
//  res.json(job);
 res.json({status:200,message:'created successfully'})
//  return true;
     
 });

 app.get("/getdata", async (req, res) => {
  try {
    const getdetails = await prisma.employee.findMany({
      // where:{status:{
      //   notIn:['approve','rejected']
      // }},
      include : {
        timesheetsRows : true
      }
    });
    let mainArr=[];
      for (let index = 0; index < getdetails.length; index++) {
        const element = getdetails[index];
        console.log('ele',element);
            element.timesheetsRows.map(ele=>{
            ele.daterange=element.daterange
            if(ele.status!= 'approve' && ele.status!= 'rejected' ){
            ele.name=element.name
            mainArr.push(ele);
            }
          })
        
       
      }
      console.log('mainArr',mainArr);
      res.status(201).json(mainArr);
    // res.status(201).json(getdetails);
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error listing employeedata" });
    console.error("Error creating user:", error);
  }
});

app.get('/getEmpDetails',async(req,res)=>{
  try {
  
    console.log('called getEmpDetails:')
    const empTimeSheetDetails=await prisma.timesheet.findFirst({
      where:{id:Number(req.query.id)},
     
    })
    console.log('empTimeSheetDetails',empTimeSheetDetails);
    if(empTimeSheetDetails?.authorId){
      const empdata=await prisma.employee.findFirst({
        where:{id:Number(empTimeSheetDetails?.authorId)},
       
      })
      empTimeSheetDetails.daterange=empdata?.daterange;
    }
    res.status(200).json(empTimeSheetDetails);
  } catch (error) {
    console.log(error);
    res
        .status(500)
        .json({ success: false, message: "Error listing employeedata" });
  }
});
app.put("/timesheetActivity", async (req, res) => {
  try{
    console.log('data',req?.body);
    const Resp = await prisma.timesheet.update(
      {
        where: { id: Number(req?.body?.id) },
        data: { "status": req?.body.status }
      })
    console.log('resp:',Resp);
    res.status(200).json(Resp);
    
  }
  catch (error) {
    console.log('error',error);
    res
      .status(500)
      .json({ success: false, message: "Error listing employeedata" });
    console.error("Error creating user:", error);
  }
 
});


// app.post("/addEmpTimeSheet", async (req, res) => {
//     const { name,daterange,timesheetsRows } = req.body;
//     try {
//       const job = await prisma.employee.create({
//         data: {
//           name,
//           daterange,
//           timesheetsRows,
//         },
//       });
//       console.log(job);
//       res.status(201).json({ success: true, message: "EmployeeData Created" });
//     } catch (error) {
//       res
//         .status(500)
//         .json({ success: false, message: "Error creating EmployeeData" });
//       console.error("Error creating user:", error);
//     }
//   });

  app.listen(port, () => {
    console.log("Server is running on port", port);
  });