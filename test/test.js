/**
 * Blockbase test file
 * @author Blacksmith <code@blacksmith.studio>
 */
const should = require('should')
process.env['NODE_CONFIG_DIR'] = __dirname + '/config'

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at:', p, 'reason:', reason)
    // application specific logging, throwing an error, or other logic here
})

const blockbase = require('blockbase')

let driver
let application

blockbase({root: __dirname}, async app => {
    driver = app.drivers.mysql = require('../driver')(app)
    application = app
})

describe('Mysql driver tests', async function () {
    describe('Initialization', function () {
        it('should initialize the app', async function () {
            should.exist(application)
        })
    })

    describe('Architecture', function () {
        it('should have models', function () {
            should.exist(application.models)
            should.exist(application.models.user)
        })
    })

    describe('Methods', function () {
        let id
        let firstname = 'toto', lastname = 'robert', favorites = [1, 34, {'a': 2}]
        it('should save a user', async function () {

            const User = application.models.user
            const UserModel = new User({firstname, lastname, favorites})
            try {
                let user = await UserModel.save()
                should.exist(user)
                should.exist(user.data)
                should.exist(user.data.firstname)
                should.exist(user.data.id)
                should.equal(user.data.firstname, firstname)
                id = user.data.id
            }
            catch (e) {
                should.not.exist(e)
            }
        })

        it('should read a user', async function () {

            const User = application.models.user
            const UserModel = new User({id})

            try {
                let existing = await UserModel.read()
                should.exist(existing)
                should.exist(existing.data)
                should.exist(existing.data.id)
                should.exist(existing.data.firstname)
                should.equal(existing.data.firstname, firstname)
            }
            catch (e) {
                should.not.exist(e)
            }
        })


        it('should update a user', async function () {

            let firstname = 'toto2', lastname = 'robert2', favorites = [1, 2, {'a': 2}]
            const User = application.models.user

            const UserModel = new User({id, firstname, lastname, favorites})

            try {
                let existing = await UserModel.update()
                should.exist(existing)
                should.exist(existing.data)
                should.exist(existing.data.id)
                should.exist(existing.data.firstname)
                should.exist(existing.data.lastname)
                should.equal(existing.data.firstname, firstname)
                should.equal(existing.data.lastname, lastname)
            }
            catch (e) {
                should.not.exist(e)
            }
        })


        it('should delete a user', async function () {

            let firstname = 'toto2', lastname = 'robert2'
            const User = application.models.user

            const UserModel = new User({id, firstname, lastname})

            try {
                let done = await UserModel.delete()
                should.exist(done)
                should.equal(done, true)
            }
            catch (e) {
                should.not.exist(e)
            }
        })
    })
})
