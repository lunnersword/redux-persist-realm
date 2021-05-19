import Realm from "realm";

const ReduxItemSchema = {
    name: "ReduxItem",
    properties: {
        name: "string",
        value: "string",
    },
    primaryKey: "name",
}

// Wrap function to support both Promise and callback
// Copied from repo https://github.com/Nohac/redux-persist-expo-fs-storage/blob/master/index.js
async function withCallback(callback, func) {
    try {
        const result = await func();
        if (callback) {
            callback(null, result);
        }
        return result;
    } catch (err) {
        if (callback) {
            callback(err);
        } else {
            throw err;
        }
    }
}

function openRealm(path = Realm.defaultPath, encryptionKey?: ArrayBuffer | ArrayBufferView | Int8Array) {
    let _realm = null;
    return async function open() {
        if (!_realm) {
            try {
                _realm = await Realm.open({ schema: [ReduxItemSchema], encryptionKey: encryptionKey, path: path})
            } catch (error) {
                throw error;
            }
        }
        return _realm;
    };
}

export function createRealmPersistStorage(path: string = Realm.defaultPath, encryptionKey?: ArrayBuffer | ArrayBufferView | Int8Array) {
    const open = openRealm(path, encryptionKey)

    async function getItem(key, callback) {
        return withCallback(callback, async function() {
            const realm = await open();
            const item = realm.objectForPrimaryKey(ReduxItemSchema.name, key)
            if (item) {
                return item.value;
            } else {
                throw new Error(`Could not get item with key: ${key}`);
            }
        });
    }

    async function setItem(key, value, callback) {
        return withCallback(callback, async function() {
            const realm = await open();
            realm.write(() => {
                realm.create(
                    ReduxItemSchema.name,
                    {name: key, value: value}, 
                    "modified"
                );
            });
        });
    }

    async function removeItem(key, callback) {
        return withCallback(callback, async function() {
            const realm = await open();
            let item = realm.objectForPrimaryKey(ReduxItemSchema.name, key)
            realm.write(() => {
                realm.delete(item);
                item = null;
            });
        });
    }

    async function close(callback) {
        return withCallback(callback, async function() {
            const realm = await open();
            realm.close();
        });
    }

    return {
        getItem,
        setItem,
        removeItem,
        close,
    };
}
  