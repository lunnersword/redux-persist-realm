import { Platform } from "react-native";
import td from "testdouble";
import Realm from "realm";
import createRealmPersistStorage from '../realm'

jest.mock(
    "realm",
    () => require("./mocks/realm.js").default
);

jest.mock("react-native", () => ({
    Platform: {
      select: jest.fn()
    }
}));

decribe("redux-persist-realm", () => {
    const path = "myrealm";
    const key = new Int8Array(64);
    let realm = Realm.open({ schema: [ReduxItemSchema], encryptionKey: key, path: path});
    const createStorage = (platform = "ios") => {
        Platform.select.mockImplementation(obj => obj[platform]);
        return createRealmPersistStorage(path, key);
    };
    const storage = createStorage();

    describe("getItem()", () => {
        describe("with a normal result", () => {
            beforeEach(() => {
                td.when(Realm.open({ schema: [ReduxItemSchema], encryptionKey: key, path: path})).thenResolve(realm);
                td.when(realm.objectForPrimaryKey(ReduxItemSchema.name, "KEY")).thenResolve("VALUE");
            });

            it("returns the value", () => {
                return expect(storage.getItem("KEY")).resolves.toBe("VALUE");
            });

            it("calls the callback with the value", done => {
                const callback = makeCallback(done, (_err, result) => {
                expect(result).toBe("VALUE");
                });
        
                storage.getItem("KEY", callback);
            });
        });

        describe("with an error", () => {
            beforeEach(() => {
                let realm = Realm.open({ schema: [ReduxItemSchema], encryptionKey: key, path: path});
                td.when(Realm.open({ schema: [ReduxItemSchema], encryptionKey: key, path: path})).thenResolve(realm);
                td.when(realm.objectForPrimaryKey(ReduxItemSchema.name, "KEY")).thenReject("ERROR");
            });
    
            it("re-throws the error", () => {
                return expect(storage.getItem("KEY")).rejects.toBe("ERROR");
            });
    
            it("calls the callback with the error", done => {
                const callback = makeCallback(done, err => {
                    expect(err).toBe("ERROR");
                });
    
                storage.getItem("KEY", callback);
            });
        });

        describe("sanitizing the result", () => {
            it("converts undefined to null", () => {
                let realm = Realm.open({ schema: [ReduxItemSchema], encryptionKey: key, path: path});
                td.when(Realm.open({ schema: [ReduxItemSchema], encryptionKey: key, path: path})).thenResolve(realm);
                td.when(realm.objectForPrimaryKey(ReduxItemSchema.name, "KEY")).thenResolve(undefined);
    
                return expect(storage.getItem("KEY")).resolves.toBeNull();
            });
    
            it("does not convert other falsy values to null", () => {
                let realm = Realm.open({ schema: [ReduxItemSchema], encryptionKey: key, path: path});
                td.when(Realm.open({ schema: [ReduxItemSchema], encryptionKey: key, path: path})).thenResolve(realm);
                td.when(realm.objectForPrimaryKey(ReduxItemSchema.name, "KEY")).thenResolve(0);
    
                return expect(storage.getItem("KEY")).resolves.toBe(0);
            });
        });
    });

    describe("setItem()", () => {
        describe("when successful", () => {
            beforeEach(() => {
                td.when(Realm.open({ schema: [ReduxItemSchema], encryptionKey: key, path: path})).thenResolve(realm);
            });
            it("forwards the value", async () => {
                await storage.setItem("KEY", "VALUE");
    
                td.verify(realm.write(() => {
                    realm.create(
                        ReduxItemSchema.name,
                        {name: "KEY", value: "VALUE"}, 
                        "modified"
                    );
                }));
            });
    
            it("calls the callback", done => {
                const callback = makeCallback(done, err => {
                    expect(err).toBeNull();
                });
    
                storage.setItem("KEY", "VALUE", callback);
            });
        });
    
        describe("with an error", () => {
            beforeEach(() => {
                td
                .when( realm.create(
                    ReduxItemSchema.name,
                    {name: "KEY", value: "VALUE"}, 
                    "modified"
                ))
                .thenReject("ERROR");
            });
    
            it("re-throws the error", () => {
                return expect(storage.setItem("KEY", "VALUE")).rejects.toBe("ERROR");
            });
    
            it("calls the callback with the error", done => {
                const callback = makeCallback(done, err => {
                    expect(err).toBe("ERROR");
                });
    
                storage.setItem("KEY", "VALUE", callback);
            });
        });
      });

      describe("removeItem()", () => {
        describe("when successful", () => {
          it("forwards the request", async () => {
            await storage.removeItem("KEY");
    
            let item = realm.objectForPrimaryKey(ReduxItemSchema.name, key)
            expect(item).toBeNull;
          });
    
          it("calls the callback", done => {
            const callback = makeCallback(done, err => {
              expect(err).toBeNull();
            });
    
            storage.removeItem("KEY", callback);
          });
        });
    
        describe("with an error", () => {
          beforeEach(() => {
            td.when(realm.delete(any)).thenReject("ERROR");
          });
    
          it("re-throws the error", () => {
            return expect(storage.removeItem("KEY")).rejects.toBe("ERROR");
          });
    
          it("calls the callback with the error", done => {
            const callback = makeCallback(done, err => {
              expect(err).toBe("ERROR");
            });
    
            storage.removeItem("KEY", callback);
          });
        });
      });
  
});

function makeCallback(done, body) {
    return (...args) => {
      try {
        body(...args);
        done();
      } catch (error) {
        done.fail(error);
      }
    };
}