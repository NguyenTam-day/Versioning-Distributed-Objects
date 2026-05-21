package org.example.cad.repository;

import org.example.cad.model.CadModel;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CadModelRepository extends MongoRepository<CadModel, String> {
}