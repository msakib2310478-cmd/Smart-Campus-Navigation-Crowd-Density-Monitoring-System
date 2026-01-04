package com.uiu.campus.util;

import com.uiu.campus.model.Zone;
import lombok.extern.slf4j.Slf4j;

import java.io.*;
import java.util.HashMap;
import java.util.Map;

@Slf4j
public class CrowdBackupUtil {
    private static final String BACKUP_FILE = "crowd_data.ser";

    public void saveToFile(Map<String, Zone> zones) {
        try (ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream(BACKUP_FILE))) {
            oos.writeObject(zones);
            log.info("Crowd data saved to {}", BACKUP_FILE);
        } catch (IOException e) {
            log.error("Error saving crowd data", e);
        }
    }

    public Map<String, Zone> loadFromFile() {
        try (ObjectInputStream ois = new ObjectInputStream(new FileInputStream(BACKUP_FILE))) {
            @SuppressWarnings("unchecked")
            Map<String, Zone> zones = (Map<String, Zone>) ois.readObject();
            log.info("Crowd data loaded from {}", BACKUP_FILE);
            return zones;
        } catch (IOException | ClassNotFoundException e) {
            log.warn("Could not load crowd data from {}: {}", BACKUP_FILE, e.getMessage());
            return null;
        }
    }
}
