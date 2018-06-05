const _ = require('underscore')
const mysql = require('mysql')

/**
 * Blockbase mysql driver (app.drivers.mysql)
 * @memberof app.drivers
 * @author Backsmith <code@blacksmith.studio>
 * @param {Object} app - Application namespace
 *
 * @returns {Object} driver object containing public methods
 */
module.exports = (app) => {
    const Logger = app.drivers.logger

    if (!app.config.has('mysql'))
        return Logger.error('Drivers', 'Can not init mysql, no valid config')

    const config = app.config.get('mysql')
    const pool = new mysql.createPool({
        user: config.user,
        database: config.database,
        password: config.password,
        host: config.host,
        port: config.port,
        max: 1000,
    })

    /**
     * Query function, executing the SQL query
     * @private
     * @name query
     * @param {string} sql - sql query (prepared or not)
     * @param {Object[]} data - array of data to pass in the prepared query
     */
    async function query(sql, data) {
        return new Promise((resolve, reject) => {
            pool.getConnection((error, connection) => {
                if (error) {
                    Logger.error('Drivers - mysql', error)
                    return reject(error)
                }

                connection.query(sql, data, (error, results) => {
                    if (error) return reject(error)
                    resolve(results)
                })
            })
        })
    }

    return {
        /**
         * Execute a custom query
         * @alias query
         */
        execute: query,

        /**
         * Create an object based on a Blocbase valid model
         * @param {Object} item - object compiled by the model
         * @return {Promise<Object>} saved item
         */
        async save(item) {
            if (!item.valid()) throw Error(item.validate().error)

            for (let [k, v] of Object.entries(item.data)) {
                if (typeof v == 'object') {
                    item.data[k] = JSON.stringify(v)
                }
            }

            try {
                let q = `INSERT INTO ${item.params.table || (item.params.type + 's')} SET ? `
                let result = await query(q, [item.data])
                item.body({id: result.insertId})
                return await item.read(item)
            } catch (e) {
                throw e
            }
        },

        /**
         * Read an object from the DB
         * @param {Object} item - object compiled by the model (needs id)
         * @return {Promise<Object>} called item
         */
        async read(item) {
            if (!item.data || !item.data.id)
                throw Error(`Cannot read an item without an 'id'`)

            let q = `SELECT * FROM ${item.params.table || (item.params.type + 's')} WHERE id=?`

            try {

                let rows = await query(q, [item.data.id])
                if (rows.length)
                    item.body(rows[0])
                return rows.length ? item : null

            } catch (e) {
                throw e
            }
        },

        /**
         * Update a valid object model
         * @param {Object} item - object compiled by the model
         * @return {Promise<Object>} updated item
         */
        async update(item) {
            if (!item.data || !item.data.id)
                throw Error(`Cannot update an item without an 'id'`)

            let updates = [], values = []
            for ([key, value] of Object.entries(item.body())) {
                updates.push(`${key}=?`)
                if (typeof value == 'object')
                    value = JSON.stringify(value)
                values.push(value)
            }
            values.push(item.data.id)

            let q = `UPDATE ${item.params.table || (item.params.type + 's')} SET ${updates.join(' , ')} WHERE id=? `

            try {
                await query(q, values)

                let rows = this.read(item)
                item.body(rows[0])
                return item
            } catch (e) {
                throw e
            }
        },

        /**
         * Delete a valid object model
         * @param {Object} item - object compiled by the model
         * @returns {Promise<boolean>} - true if deleted
         */
        async delete(item) {
            if (!item.data || !item.data.id)
                throw Error(`Cannot delete an item without an 'id'`)

            let q = `DELETE FROM ${item.params.table || (item.params.type + 's')} WHERE id=?`

            try {
                let result = await query(q, [item.data.id])
                return result.affectedRows > 0
            } catch (e) {
                throw e
            }
        }
    }
}
