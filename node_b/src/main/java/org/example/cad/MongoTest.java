package org.example.cad;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.MongoIterable;

public class MongoTest {
    public static void main(String[] args) {
        String uri = "mongodb+srv://cad_node_b:Qwertyuiop123%21@cluster0.fl6igei.mongodb.net/?appName=Cluster0";
        try (MongoClient mongoClient = MongoClients.create(uri)) {
            MongoIterable<String> dbNames = mongoClient.listDatabaseNames();
            for (String name : dbNames) {
                System.out.println("Database: " + name);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
