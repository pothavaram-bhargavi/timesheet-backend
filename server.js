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
  const finalTimeSheetRows =timesheetsRows.map(ele=>{
    ele.daterange=daterange;
    return ele;
});
console.log('finalTimeSheetRows:',finalTimeSheetRows)
console.log('name',name,'daterange',daterange,'timesheetsRows',timesheetsRows,'totalhours',totalhours)
const recordExist=await prisma.employee.findFirst({
where:{
  name:req.body.name,
  daterange:req.body.daterange
},

})
if(recordExist && recordExist?.name){
console.log('exist:',recordExist);
res.json({status:201,message:'record exist'})
}else{
console.log('not exist:');
const job = await prisma.employee.create({
  data:{
   name:req.body.name,
   daterange:req.body.daterange,
   totalhours:req.body.totalhours,
   timesheetsRows:{
       createMany:{ 
        data:finalTimeSheetRows
       }
       
   }
  }
});
console.log(job);
//  res.json(job);
res.json({status:200,message:'created successfully'})
}

//  return true;
   
});

// app.post('/addEmpTimeSheet', async (req, res) => {
//     const{ name,daterange,timesheetsRows,totalhours} =req.body;
//     const preparedTimesheetRows =timesheetsRows.map(ele=>{
//       ele.daterange=daterange
//       return ele;
//   });
//   console.log('prepared',preparedTimesheetRows)
//  console.log('name',name,'daterange',daterange,'timesheetsRows',timesheetsRows,'totalhours',totalhours)
//  const recordExist=await prisma.employee.findFirst({
//   where:{
//     name:req.body.name,
//     daterange:daterange
//   },
 
// })
// if(recordExist && recordExist?.name){
//   console.log('exist:',recordExist);
//   res.json({status:401,message:'Already exist'})
// }else{
//   const job = await prisma.employee.create({
//         data:{
//          name:req.body.name,
//          daterange:req.body.daterange,
//          totalhours:req.body.totalhours,
//          timesheetsRows:{
//              createMany:{ 
//               data:preparedTimesheetRows
//              }
             
//          }
//         }
//       });
//       console.log(job);
//   console.log('not exist:');
//   res.json({status:200,message:'created successfully'})
// }

//  const job = await prisma.employee.create({
//     data:{
//      name:req.body.name,
//      daterange:req.body.daterange,
//      totalhours:req.body.totalhours,
//      timesheetsRows:{
//          createMany:{ 
//           data:req.body.timesheetsRows
//          }
         
//      }
//     }
//   });
//   console.log(job);
//  res.json(job);
 
//  return true;
     


 app.get("/getdata", async (req, res) => {
  try {
    let getdetails;
     if(req.query.daterange){
      getdetails=await prisma.employee.findMany({
        where:{
          daterange:req.query.daterange
      },
        include : {
          timesheetsRows : true,
          // where:{
          //   projectCode:"WFS_1101"
          // }
        }
      });
    }else{
      getdetails = await prisma.employee.findMany({
        // where:{status:{
        //   notIn:['approve','rejected']
        // }},
        include : {
          timesheetsRows : true,
          // where:{
          //   projectCode:"WFS_1101"
          // }
        }
      });
    }
    // const getdetails = await prisma.employee.findMany({
    //   // where:{status:{
    //   //   notIn:['approve','rejected']
    //   // }},
    //   include : {
    //     timesheetsRows : true
    //   }
    // });
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
    const Resp = await prisma.timesheet.updateMany(
      {
        where: { id: {in :req?.body?.id} },
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
app.put('/modifyUserTimeSheet',async(req,res)=>{
  try {
    console.log('modify user req:',req.body);
    const {timesheetsRows}=req.body;
    timesheetsRows.map(async ele=>{
      console.log('ele',ele);
      await prisma.timesheet.update(
        {
        where:{id:Number(ele?.id)},
        data:{
              "projectCode": ele.projectCode,
              "jobCode": ele.jobCode,
              "day1": ele.day1,
              "day2": ele.day2,
              "day3": ele.day3,
              "day4": ele.day4,
              "day5": ele.day5,
              "day6": ele.day6,
              "day7": ele.day7,
              "total": ele.total,
              "status":''
      }
    })
    })
    res.json({success:true,message:'user timeSheet modified successfully.'});
  } catch (error) {
    console.log('error',error);
    res.status(500).json({ success: false, message: "Error modify Employee TimeSheet Data" });
  }
});
app.get("/getEmpTimeSheetdata", async (req, res) => {
  try {
    console.log('getdata:',req.query);
    let getdetails;
    if(req.query?.name && req.query.daterange){
      getdetails=await prisma.employee.findMany({
        where:{
          name:req.query?.name,
          daterange:req.query.daterange
      },
        include : {
          timesheetsRows : true,
          // where:{
          //   projectCode:"WFS_1101"
          // }
        }
      });
    }
    let mainArr=[];
      for (let index = 0; index < getdetails.length; index++) {
        const element = getdetails[index];
        // console.log('ele',element);
            element.timesheetsRows.map(ele=>{
            ele.daterange=element.daterange             
            ele.name=element.name
            mainArr.push(ele);              
          })
      }
      // console.log('mainArr',mainArr);
      res.status(201).json(mainArr);
    // res.status(201).json(getdetails);
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error listing employeedata" });
    console.error("Error creating user:", error);
  }
});
// app.put("/timesheetActivity", async (req, res) => {
//   try{
//     console.log('data',req?.body);
//     const Resp = await prisma.timesheet.update(
//       {
//         where: { id: Number(req?.body?.id) },
//         data: { "status": req?.body.status }
//       })
//     console.log('resp:',Resp);
//     res.status(200).json(Resp);
    
//   }
//   catch (error) {
//     console.log('error',error);
//     res
//       .status(500)
//       .json({ success: false, message: "Error listing employeedata" });
//     console.error("Error creating user:", error);
//   }
 
// });


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