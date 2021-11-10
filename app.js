const express=require("express");
const bodyparser=require("body-parser");
require("dotenv").config();
const app=express();

app.set("view engine","ejs");
app.set("views","views");

app.use(express.static("public"));
app.use(express.urlencoded({extended:true}));

const db=require('./database.js');


app.get("/", (req,res) =>{
    res.render('index',{title:"Banking" ,path:"/"});
});

app.get("/customers" , (req,res) =>{
    db.execute("SELECT * FROM customers")
    .then(([rows,fieldData])=>{ 
        res.render('customers',{title:"List of Customers" ,userData:rows,check:"yes",path:"/customers"});
    })
    .catch(err=>{ 
        console.log(err);
    });
});


app.get("/add-user", (req,res) =>{
    res.render("add-user",{title:"New User",path:"/add-user"});
});

app.post("/add" ,(req,res) =>{
    const user=req.body;
    const userDetail=[user.Name,user.email,user.amount];
    db.execute("INSERT INTO customers (Name, Email_id, Balance) VALUES(?,?,?)",userDetail)
    .then(() =>{ 
        res.send('<script>alert("User added successfully!!");location.href="/customers"</script>');
    })
    .catch(err=>{ 
        console.log(err);
        res.send('<script>alert("The user with the same Email Id already exists");location.href="/add-user"</script>');
    });
});


app.get("/transact/:id", (req,res) =>{
    const id=req.params.id;
    db.execute("SELECT * FROM customers WHERE Account_no= ?",[id])
    .then(([rows,fieldData])=>{ 
        res.render('customers',{title:"View and Transact" ,userData:rows,check:'no',path:"/transact",id:id});
    })
    .catch(err=>{ 
        console.log(err);
    });
});

app.get('/transfer-money/:id',(req,res) =>{
    const id=req.params.id;
    db.execute("SELECT * FROM customers").then(([rows,fieldData])=>{ 
        res.render("transfer",{title:"Tranfer Money",userData:rows,path:"/tranfer-money",id:id});
    })
    .catch(err=>{ 
        console.log(err);
    });
    
})

app.post("/transfer", (req,res) =>{
    const date=new Date();
    let d = ("0" + date.getDate()).slice(-2);
    let m = ("0" + (date.getMonth() + 1)).slice(-2);
    const date_time=(date.getFullYear() + "-" + m + "-" + d +" " +date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds());
    const user=req.body;
    const send=user.sender;
    const rec=user.receiver;
    const arr=[];
    let remain
    db.execute("SELECT * FROM customers WHERE name= ?",[send])
    .then(([rows,fieldData])=>{ 
        if(rows[0].Balance >user.amount_sent)
        {
            remain=rows[0].Balance-user.amount_sent;
            return db.execute("SELECT * FROM customers WHERE name= ?",[rec])
        }
    })
    .then(([rows,fieldData])=>{
        let x=Number(rows[0].Balance);
        let y=Number(user.amount_sent);
        const increase=x+y;
        return db.execute('UPDATE customers SET Balance ='+increase+' WHERE name= ?',[rec])
    })
    .then(() =>{
        return db.execute('UPDATE customers SET Balance ='+remain+' WHERE name= ?',[send])
    })
    .then(()=>{
        const userDetail=[user.sender,user.receiver,user.amount_sent,date_time];
        return db.execute("INSERT INTO transactions (sender, receiver, amount,date) VALUES(?,?,?,?)",userDetail)
    })
    .then(() =>{ 
         res.send('<script>alert("Transaction successfull!");location.href="/view-transactions"</script>');
    })      
    .catch(err=>{
        console.log(err);
        res.send('<script>alert("Insufficient balance available");location.href="/"</script>');
    });
});

app.get("/view-transactions",(req,res) =>{
    db.execute("SELECT * FROM transactions")
    .then(([rows,fieldData])=>{ 
        res.render('view transactions',{title:"View Transactions" ,userData:rows,path:"/view-transactions"});
    })
    .catch(err=>{ 
        console.log(err);
    });
})


app.listen(process.env.PORT || 3000);





