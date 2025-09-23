const express=require('express');
const cookieParser=require('cookie-parser')


/*importing routes */
const authroutes=require('./routes/auth.routes')
const chatroutes=require('./routes/chat.routes')



const app=express();

/* middlewares */
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // ✅ parses form-data / x-www-form-urlencoded
app.use(cookieParser());


/* using Routes */ 
app.use('/api/auth',authroutes);
app.use('/api/chat',chatroutes);

module.exports=app;
