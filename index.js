/**
* Name: index
*
* @author Samer Alotaibi
*		  sam@samiscoding.com
*
*
* Description: lightweight server to serve images
*
* Requirements: express, morgan, cors, nodemon
*
* @package commerce
* @property
*
* @version 1.0
*/
const express = require('express');
const morgan = require('morgan');
const app = express();
const cors = require('cors');
const path = require('path');


/**
 * S E T T I N G S
 */
app.set('port', process.env.PORT || 7120);

/**
 * M I D D L E W A R E S
 */
app.use(morgan('dev'));
app.use(express.json());
app.use(cors({origin: '*'}));


/**
 * R O U T E S
 */ 
app.use('/screenshots', express.static('screenshots'));
app.use('/thumbnails', express.static('thumbnails'));
/**
 * S T A R T I N G   S E R V E R
 */

app.listen(app.get('port'), (error) => {
    if (error)
    {
        console.log('Error on server: ',err);
    } 
    else {
        console.log('Server on port', app.get('port'));
    }
});

/**
 * T E S T I N G   P A G E
 */
app.get('/test', (req, res, err)=>{
    res.sendFile(path.join(__dirname, 'test.html'));
})
/** this ends this file
* server/index
**/